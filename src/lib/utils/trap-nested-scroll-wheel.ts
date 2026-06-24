import type {
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from "react"

function isScrollable(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight + 1
}

function isAtScrollEdge(element: HTMLElement, deltaY: number): boolean {
  const atTop = element.scrollTop <= 0
  const atBottom =
    element.scrollTop + element.clientHeight >= element.scrollHeight - 1

  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom)
}

export function trapNestedScrollWheel(event: ReactWheelEvent<HTMLDivElement>) {
  event.stopPropagation()

  const element = event.currentTarget
  if (!isScrollable(element)) {
    return
  }

  const { deltaY } = event
  if (deltaY === 0) {
    return
  }

  if (isAtScrollEdge(element, deltaY)) {
    event.preventDefault()
  }
}

export function trapNestedScrollTouch(event: ReactTouchEvent<HTMLDivElement>) {
  event.stopPropagation()

  const element = event.currentTarget
  if (!isScrollable(element)) {
    return
  }

  const touch = event.touches[0] ?? event.changedTouches[0]
  if (!touch) {
    return
  }

  const previousY = Number(element.dataset.touchY ?? touch.clientY)
  const deltaY = previousY - touch.clientY
  element.dataset.touchY = String(touch.clientY)

  if (deltaY === 0) {
    return
  }

  if (isAtScrollEdge(element, deltaY)) {
    event.preventDefault()
  }
}

export function resetNestedScrollTouch(event: ReactTouchEvent<HTMLDivElement>) {
  const touch = event.touches[0]
  if (touch) {
    event.currentTarget.dataset.touchY = String(touch.clientY)
  }
}
