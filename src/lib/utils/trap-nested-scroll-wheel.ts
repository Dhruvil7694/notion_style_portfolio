import type { WheelEvent as ReactWheelEvent } from "react"

export function trapNestedScrollWheel(event: ReactWheelEvent<HTMLDivElement>) {
  event.stopPropagation()

  const element = event.currentTarget
  if (element.scrollHeight <= element.clientHeight + 1) {
    return
  }

  const { deltaY } = event
  if (deltaY === 0) {
    return
  }

  const atTop = element.scrollTop <= 0
  const atBottom =
    element.scrollTop + element.clientHeight >= element.scrollHeight - 1

  if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
    event.preventDefault()
  }
}
