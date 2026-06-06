# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Development

Start the development server on `http://localhost:3000`:

```bash

# pnpm
pnpm dev
pnpm build
pnpm preview

# docker
docker build -t forcedskin:0.0.8 .
docker save -o forcedskin.0.0.8.tar forcedskin:0.0.8
docker load -i forcedskin.0.0.8.tar

# prisma
npx prisma migrate dev --name init-db
npx prisma migrate deploy
npx prisma generate

# git 
git tag v0.0.8
git push origin tag v0.0.8
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
