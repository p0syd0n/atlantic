module.exports = function (req) {
  if (!req) throw new Error('Request object required to find client IP address');

  var forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor !== undefined) return forwardedFor.split(',')[0];

  var cf = req.headers['cf-connecting-ip'];

  if (cf !== undefined) return cf;

  return req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
}