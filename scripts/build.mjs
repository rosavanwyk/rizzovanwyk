// Builds the Tina editor only when Tina Cloud keys are configured, so the
// public site always deploys even before the editor is connected.
import { execSync } from 'node:child_process'

const run = (command) => execSync(command, { stdio: 'inherit' })

if (process.env.NEXT_PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN) {
  run('npx tinacms build')
} else {
  console.log('Tina Cloud keys not set: building the site without the /admin editor.')
}
run('npx next build')
