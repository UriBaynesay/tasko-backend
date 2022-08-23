const Cryptr = require("cryptr")
const bcrypt = require("bcrypt")
const userService = require("../user/user.service")
const logger = require("../../services/logger.service")
// create secrete1 env variable on machine
const cryptr = new Cryptr(process.env.SECRET1 || "Secret-Puk-1234")

async function login(email, password) {
  const user = await userService.getByEmail(email)
  if (!user) return Promise.reject("Invalid username or password")

  const match = await bcrypt.compare(password, user.password)
  if (!match) return Promise.reject("Invalid username or password")

  delete user.password
  user._id = user._id.toString()
  return user
}

async function signup({ email, fullname, password }) {
  const saltRounds = 10

  logger.debug(
    `auth.service - signup with email: ${email}, fullname: ${fullname}`
  )
  if (!fullname || !password || !email)
    return Promise.reject("Missing required signup information")

  const userExist = await userService.getByEmail(email)
  if (userExist) return Promise.reject("Username already taken")

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({ email, password: hash, fullname })
}

function getLoginToken(user) {
  return cryptr.encrypt(JSON.stringify(user))
}

function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json)
    return loggedinUser
  } catch (err) {
    console.log("Invalid login token")
  }
  return null
}

module.exports = {
  signup,
  login,
  getLoginToken,
  validateToken,
}
