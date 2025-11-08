#!/bin/bash

# Get current branch name
branch=$(git rev-parse --abbrev-ref HEAD)

# Get today's date
today=$(date +"%Y-%m-%d")

# Commit and push
git add .
git commit -m "Working version on $today"
git push origin "$branch"

echo "✅ Pushed to $branch with message: Working version on $today"
