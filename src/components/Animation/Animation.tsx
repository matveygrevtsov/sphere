import React, { useEffect } from 'react'
import { Animator } from './Animator'

const containerHtmlElementId = 'animationContainer'

export const Animation = () => {
  useEffect(() => {
    const containerHtmlElement = document.getElementById(containerHtmlElementId)
    if (!containerHtmlElement) {
      return undefined
    }
    const animator = new Animator({ containerHtmlElement })
    animator.start()
    return () => animator.destroy()
  }, [])

  return <div id={containerHtmlElementId} />
}
