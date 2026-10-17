import { Component } from 'react'

// Catches failures from the lazy 3D chunk or WebGL context creation and shows the fallback instead.
export default class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[hero] 3D scene unavailable, showing the static version instead.', error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
