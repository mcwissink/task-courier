{
    echo REACT_APP_GIT_SHA=$(git rev-parse --short HEAD)
} > .env
