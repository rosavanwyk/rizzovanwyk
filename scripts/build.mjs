// Builds the Tina editor only when Tina Cloud keys are configured, so the
// public site always deploys even before the editor is connected.
//
// When the editor schema changes, Tina Cloud needs a minute or two to re-index
// the branch, and `tinacms build` fails until it has. So we retry a few times,
// and as a last resort skip the cloud checks rather than block the deploy.
import { execSync } from 'node:child_process'

const run = (command) => execSync(command, { stdio: 'inherit' })
const sleep = (seconds) => execSync(`sleep ${seconds}`)

function buildEditor() {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      run('npx tinacms build')
      return
    } catch {
      console.log(`Tina build attempt ${attempt} failed (Tina Cloud may still be indexing). Retrying in 45s…`)
      sleep(45)
    }
  }
  console.log('Tina Cloud checks still failing: building the editor without them.')
  run('npx tinacms build --skip-cloud-checks')
}

if (process.env.NEXT_PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN) {
  buildEditor()
} else {
  console.log('Tina Cloud keys not set: building the site without the /admin editor.')
}
run('npx next build')
