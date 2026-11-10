import { Separator } from 'react-resizable-panels'

function ResizeHandle({ vertical, ...props }) {
  return (
    <Separator
      {...props}
      className={`shrink-0 bg-gray-700 transition-colors hover:bg-green-500 data-[separator=active]:bg-green-500 ${
        vertical ? 'h-1.5 cursor-row-resize' : 'w-1.5 cursor-col-resize'
      }`}
    />
  )
}

export default ResizeHandle
