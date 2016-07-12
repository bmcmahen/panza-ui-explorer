/*eslint-disable no-console*/
import path from 'path'
import throng from 'throng'
import morgan from 'morgan'
import express from 'express'
import cookieParser from 'cookie-parser'
import cookieSession from 'cookie-session'
import devErrorHandler from 'errorhandler'
import WebpackDevServer from 'webpack-dev-server'
import webpackConfig from '../../webpack.config'
import { SessionDomain, SessionSecret } from './SessionConfig'
import { staticAssets, devAssets, createDevCompiler } from './AssetsUtils'
import { sendHomePage } from './MainController'

const createSession = (config) => {
  const sessionConfig = {
    name: `sess_${process.env.NODE_ENV}`,
  }

  if (config.sessionDomain)
    sessionConfig.domain = config.sessionDomain

  if (config.sessionSecret) {
    sessionConfig.secret = config.sessionSecret
  } else {
    sessionConfig.signed = false
  }

  return cookieSession(sessionConfig)
}

export const createRouter = (config = {}) => {
  const router = express.Router()

  router.use(cookieParser())
  router.use(createSession(config))
  router.get('/', sendHomePage)

  return router
}

const errorHandler = (err, req, res, next) => {
  res.status(500).send('<p>Internal Server Error</p>')
  console.error(err.stack)
  next(err)
}

export const createServer = (config) => {
  const app = express()

  app.disable('x-powered-by')
  app.use(errorHandler)
  app.use(express.static(config.publicDir))
  app.use(staticAssets(config.statsFile))
  app.use(createRouter(config))

  return app
}

export const createDevServer = (config) => {
  const webpackConfig = config.webpackConfig
  const compiler = createDevCompiler(
    webpackConfig,
    `webpack-dev-server/client?http://localhost:${config.port}`
  )

  const server = new WebpackDevServer(compiler, {
    // webpack-dev-middleware options.
    publicPath: webpackConfig.output.publicPath,
    quiet: false,
    noInfo: false,
    stats: {
      // https://webpack.github.io/docs/node.js-api.html#stats-tojson
      assets: true,
      colors: true,
      version: true,
      hash: true,
      timings: true,
      chunks: false
    },

    // webpack-dev-server options.
    contentBase: false,
    setup(app) {
      // This runs before webpack-dev-middleware.
      app.disable('x-powered-by')
      app.use(morgan('dev'))
    }
  })

  // This runs after webpack-dev-middleware.
  server.use(devErrorHandler())
  server.use(express.static(config.publicDir))
  server.use(devAssets(compiler))
  server.use(createRouter(config))

  return server
}

const port = process.env.PORT || 5000
const statsFile = path.resolve(__dirname, '../../stats.json')
const publicDir = path.resolve(__dirname, '../../public')

const DefaultServerConfig = {
  id: 1,
  port,
  webpackConfig,
  statsFile,
  publicDir,
  sessionDomain: SessionDomain,
  sessionSecret: SessionSecret
}

export const startServer = (serverConfig) => {
  const config = {
    ...DefaultServerConfig,
    ...serverConfig
  }

  const server = process.env.NODE_ENV === 'production'
    ? createServer(config)
    : createDevServer(config)

  server.listen(config.port, () => {
    console.log('Server #%s listening on port %s, Ctrl+C to stop', config.id, config.port)
  })
}

if (require.main === module)
  throng({
    start: (id) => startServer({ id }),
    workers: process.env.WEB_CONCURRENCY || 1,
    lifetime: Infinity
  })
