const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const { signup, login, refresh, logout, getMe, generateTokens, setRefreshCookie } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes'
});

router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
], signup);

router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }), (req, res) => {
  const { accessToken, refreshToken } = generateTokens(req.user);
  setRefreshCookie(res, refreshToken);
  // Redirect to frontend with access token or just a success page that posts message to opener
  // We'll redirect to the library page and the frontend will fetch /refresh to get the access token
  res.redirect(`${process.env.FRONTEND_URL}/library?auth_success=true`);
});

module.exports = router;
