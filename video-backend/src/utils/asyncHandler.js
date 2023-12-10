const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
};

export { asyncHandler };

// const asyncHandler = (fn) => {async() => {}}
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, req, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
