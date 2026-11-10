const { execFile, spawn } = require('child_process')

const MAX_OUTPUT = 64 * 1024
const MAX_RUNNING = 2
let running = 0

function docker(args, timeout) {
    return new Promise((resolve, reject) => {
        execFile('docker', args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || err.message).trim()))
            resolve(stdout.trim())
        })
    })
}

// Returns the image's entrypoint as an array (pulls the image if missing)
async function ensureImage(image) {
    const inspect = () => docker(['image', 'inspect', '--format', '{{json .Config.Entrypoint}}', image], 30000)
    try {
        return JSON.parse(await inspect())
    } catch {
        try {
            await docker(['pull', image], 10 * 60 * 1000)
        } catch (e) {
            throw new Error(`grader image ${image} unavailable: ${e.message}`)
        }
        return JSON.parse(await inspect())
    }
}

function start(cid, code, timeoutMs, signal) {
    return new Promise((resolve) => {
        const p = spawn('docker', ['start', '-ai', cid])
        p.stdin.on('error', () => {}) // EPIPE if the container exits before reading
        p.stdin.end(code)
        let output = ''
        let truncated = false
        let timedOut = false
        const onData = (d) => {
            if (output.length < MAX_OUTPUT) output += d.toString()
            else truncated = true
        }
        p.stdout.on('data', onData)
        p.stderr.on('data', onData)
        const timer = setTimeout(() => {
            timedOut = true
            p.kill() // container itself is removed by the caller's finally
        }, timeoutMs)
        const onAbort = () => p.kill()
        signal?.addEventListener('abort', onAbort, { once: true })
        p.on('close', (code) => {
            clearTimeout(timer)
            signal?.removeEventListener('abort', onAbort)
            if (output.length > MAX_OUTPUT) { output = output.slice(0, MAX_OUTPUT); truncated = true }
            output = output.split('\n').filter((l) => !/^__RC__\d+$/.test(l.trim())).join('\n')
            if (truncated) output += '\n[output truncated]'
            const stopped = !!signal?.aborted
            resolve({ passed: code === 0 && !timedOut && !stopped, output, timedOut, ...(stopped && { stopped }) })
        })
        p.on('error', (e) => {
            clearTimeout(timer)
            resolve({ passed: false, output: e.message, timedOut: false })
        })
    })
}

async function runInImage({ image, exercise, file, allowedFunctions = [], code, extraFile, runOnly, timeoutMs, signal }) {
    if (running >= MAX_RUNNING) {
        const err = new Error('Grader is busy, try again shortly')
        err.busy = true
        throw err
    }
    running++
    let cid
    try {
        const override = process.env[`GRADER_IMAGE_${image.split('/').pop().split(':')[0].toUpperCase().replace(/-/g, '_')}`]
        if (override) image = override
        const entrypoint = (await ensureImage(image)) || []
        const args = ['create', '-i', '--label', 'solid-tester-grader', '--network', 'none', '--memory', '1g', '--cpus', '1', '--pids-limit', '256',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '-w', '/jail',
            '--read-only', '--tmpfs', '/jail:rw,exec,size=512m,mode=1777', '--tmpfs', '/tmp:rw,exec,size=256m,mode=1777', '--user', '1000:1000',
            '-e', 'HOME=/jail', '-e', `EXERCISE=${exercise}`, '-e', `FILE=${file}`, '-e', `EDITOR_FILES=${extraFile ? `${file},${extraFile.path}` : file}`,
            '-e', `ALLOWED_FUNCTIONS=${allowedFunctions.join(' ')}`, '-e', 'CODE_EDITOR_MODE=true',
            '-e', 'CARGO_NET_OFFLINE=true']
        if (runOnly) args.push('-e', 'CODE_EDITOR_RUN_ONLY=true')
        if (extraFile) args.push('-e', `MAIN_FILE=${extraFile.path}`, '-e', `MAIN_CODE=${extraFile.code}`)
        args.push('--entrypoint', '/bin/sh', image, '-c', 'mkdir -p "/jail/student/$(dirname "$FILE")" && cat > "/jail/student/$FILE" && if [ -n "$MAIN_FILE" ]; then mkdir -p "/jail/student/$(dirname "$MAIN_FILE")" && printf "%s" "$MAIN_CODE" > "/jail/student/$MAIN_FILE"; fi && exec "$@"', 'sh', ...entrypoint)
        if (signal?.aborted) return { passed: false, output: '', timedOut: false, stopped: true }
        cid = await docker(args, 60000)
        if (signal?.aborted) return { passed: false, output: '', timedOut: false, stopped: true }

        return await start(cid, code, timeoutMs || 60000, signal)
    } finally {
        running--
        if (cid) await docker(['rm', '-f', cid], 30000).catch(() => {})
    }
}

// Remove grader containers left behind by a crash or restart
async function reapOrphans() {
    const ids = (await docker(['ps', '-aq', '--filter', 'label=solid-tester-grader'], 30000)).split('\n').filter(Boolean)
    if (ids.length) await docker(['rm', '-f', ...ids], 30000)
}

module.exports = { runInImage, reapOrphans }
