read -p 'major/minor/patch: ' type

if [[type == 'major']]; then
  npm version major
elif [[type == 'minor']]; then
  npm version minor
elif [[type == 'patch']]; then
  npm version patch
else 
  exit 1

npx semantic-release --no-ci