const { Ticket, TestCase } = require('../models');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.createTicket = async (req, res, next) => {
  try {
    const { ticketId, title, description, status, priority, testCases } = req.body;

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      status,
      priority,
    });

    if (testCases && testCases.length > 0) {
      // Link test cases to ticket
      await Promise.all(
        testCases.map(async (testCaseId) => {
          await TestCase.findByIdAndUpdate(testCaseId, { $addToSet: { tickets: ticket._id } });
        }),
      );

      ticket.testCases = testCases;
      await ticket.save();
    }

    logger.info('Created new ticket', { ticketId: ticket.ticketId });

    res.status(201).json({
      status: 'success',
      data: ticket,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new APIError('Ticket ID already exists', 400));
    }
    next(error);
  }
};

exports.getAllTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find().populate('testCases', 'title status').sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('testCases', 'title status steps');

    if (!ticket) {
      throw new APIError('Ticket not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('testCases', 'title status');

    if (!ticket) {
      throw new APIError('Ticket not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

exports.linkTestCase = async (req, res, next) => {
  try {
    const { ticketId, testCaseId } = req.params;

    const [ticket, testCase] = await Promise.all([
      Ticket.findById(ticketId),
      TestCase.findById(testCaseId),
    ]);

    if (!ticket || !testCase) {
      throw new APIError('Ticket or Test Case not found', 404);
    }

    // Add references both ways
    ticket.testCases.addToSet(testCaseId);
    testCase.tickets.addToSet(ticketId);

    await Promise.all([ticket.save(), testCase.save()]);

    logger.info('Linked test case to ticket', {
      ticketId: ticket.ticketId,
      testCaseId: testCase._id,
    });

    res.status(200).json({
      status: 'success',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
