#!/bin/bash

# Stage all changes
git add .

# Check if a commit message was passed as an argument
if [ -n "$1" ]; then
  commitMessage="$1"
else
  echo "Enter commit message: "
  read commitMessage
fi

# Commit with the message
git commit -m "$commitMessage"

# Push changes
git push
