import * as esbuild from 'esbuild'

const args = process.argv.slice(2)
const opt = {
  entryPoints: ['./src/core.ts'],
  bundle: true,
  outfile: './test/core.browser.js',
  format: 'iife',
  target: 'esnext',
  minify: true,
}
if (args.includes("-d")) {
  const ctx = await esbuild.context(opt)
  console.log('auto build running')
  await ctx.watch()
  console.log('watch has ended')
} else {
  await esbuild.build(opt)
}
