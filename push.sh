read -p 'major/minor/patch: ' type

if [[ $type == 'major' ]]; then
 npm version major
elif [[ $type == 'minor' ]]; then
 npm version minor
elif [[ $type == 'patch' ]]; then
 npm version patch
else 
 echo "Invalid input!"
 exit 1
fi

npx semantic-release --no-ci
git push