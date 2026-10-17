// A section's distance from the top of the page. Uses offsetTop, which ignores
// CSS transforms, so scaled or shifted sections still report their true position.
export function pageTop(el) {
  let top = 0
  for (let node = el; node; node = node.offsetParent) top += node.offsetTop
  return top
}
