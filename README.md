# Web Downloader
Have you ever wanted to download your favorite character from WebAO? Now you can! Type in the name of the character you want and it will zip up all of their animations and sounds.

## Development
### Setting up your environment
This project supports [nvm](https://github.com/nvm-sh/nvm) for managing node version support.
To run this locally:
1. `nvm use`
2. `npm ci`
3. `npm run dev-server`
4. Visit `http://localhost:8080`

### Creating a production build
Running `npm run build` will build the /dist folder which is ready for static content hosting.
