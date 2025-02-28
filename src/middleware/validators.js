const { body } = require('express-validator');

exports.validateTicket = [
  body('ticketId')
    .trim()
    .notEmpty()
    .withMessage('Ticket ID is required')
    .matches(/^[A-Z]+-\d+$/)
    .withMessage('Invalid ticket ID format (e.g., PROJ-123)'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
];

exports.validateAuth = [
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').if(body('name').exists()).trim().notEmpty().withMessage('Name is required'),
];
