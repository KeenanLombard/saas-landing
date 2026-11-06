import { writeFile } from 'node:fs/promises';
const tau = Math.PI * 2;
function point(u, v) {
  let x = (156 + 66 * Math.cos(v)) * Math.cos(u);
  let y = (156 + 66 * Math.cos(v)) * Math.sin(u);
  let z = 66 * Math.sin(v);
  const ax = 1.03, ay = -.28, az = -.52;
  [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
  [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
  const perspective = 870 / (870 - z);
  return [300 + x * perspective, 285 + y * perspective, z];
}
const paths = [];
for (let i = 0; i < 100; i++) {
  const points = Array.from({ length: 97 }, (_, j) => point(i / 100 * tau, j / 96 * tau));
  const depth = points.reduce((sum, p) => sum + p[2], 0) / points.length;
  paths.push({ depth, d: points.map((p,j) => `${j ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('') + 'Z', opacity: .27 + (depth + 200) / 400 * .5 });
}
for (let i = 0; i < 20; i++) {
  const points = Array.from({ length: 181 }, (_, j) => point(j / 180 * tau, i / 20 * tau));
  paths.push({ depth: 0, d: points.map((p,j) => `${j ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('') + 'Z', opacity: .26 });
}
paths.sort((a,b) => a.depth - b.depth);
await writeFile('assets/orbit.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 570" fill="none"><g stroke="#243dff" stroke-width=".65">${paths.map(p => `<path d="${p.d}" opacity="${p.opacity.toFixed(2)}"/>`).join('')}</g></svg>`);
