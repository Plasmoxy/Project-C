console.log("Yes")

interface Window {
  s: any,
}

let s = {
  a: 4
}

window.s = s

setInterval(() => {
  console.log(s.a)
}, 2000)