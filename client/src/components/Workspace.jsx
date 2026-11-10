import { Group, Panel, useDefaultLayout } from 'react-resizable-panels'
import ResizeHandle from './ResizeHandle'

// Description | (toolbar + editor / output), sizes persisted per `id`.
function Workspace({ id, description, toolbar, editor, output }) {
  const outer = useDefaultLayout({ id: `${id}-h`, storage: localStorage })
  const inner = useDefaultLayout({ id: `${id}-v`, storage: localStorage })

  return (
    <Group orientation="horizontal" className="flex-1 overflow-hidden" {...outer}>
      <Panel id="description" defaultSize="35%" minSize="20%" className="bg-gray-800 flex flex-col">
        {description}
      </Panel>
      <ResizeHandle aria-label="Resize description" />
      <Panel id="work" defaultSize="65%" minSize="20%">
        <Group orientation="vertical" {...inner}>
          <Panel id="editor" defaultSize="70%" minSize="20%" className="flex flex-col">
            {toolbar}
            <div className="flex-1 min-h-0">{editor}</div>
          </Panel>
          <ResizeHandle vertical aria-label="Resize output" data-testid="output-handle" />
          <Panel id="output" defaultSize="30%" minSize="10%" className="bg-gray-950 flex flex-col" data-testid="output-panel">
            {output}
          </Panel>
        </Group>
      </Panel>
    </Group>
  )
}

export default Workspace
