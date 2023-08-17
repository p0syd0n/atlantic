var test = require('tape');
var ip = require('./');

var dummy = '127.0.0.1';

test(function( t ){
	t.throws(function(){
		ip();
	});

	t.equal(ip({
		headers: {
			'cf-connecting-ip': dummy,
		},
		connection: {
			socket: {},
		},
		socket: {},
	}), dummy);

	t.equal(ip({
		headers: {
			'cf-connecting-ip': '127.0.0.2',
			'x-forwarded-for': dummy,
		},
		connection: {
			socket: {},
		},
		socket: {},
	}), dummy);

	t.equal(ip({
		headers: {
			'x-forwarded-for': dummy,
		},
		connection: {
			socket: {},
		},
		socket: {},
	}), dummy);

	t.equal(ip({
		headers: {
			'x-forwarded-for': [ '127.0.0.2', dummy ].join(', '),
		},
		connection: {
			socket: {},
		},
		socket: {},
	}), '127.0.0.2');

	t.equal(ip({
		headers: {},
		connection: {
			socket: {},
			remoteAddress: dummy,
		},
		socket: {},
	}), dummy);

	t.equal(ip({
		headers: {},
		connection: {
			socket: {
				remoteAddress: dummy,
			},
		},
		socket: {},
	}), dummy);

	t.equal(ip({
		headers: {},
		connection: {
			socket: {},
		},
		socket: {
			remoteAddress: dummy,
		},
	}), dummy);

	t.equal(ip({
		headers: {},
		connection: {
			socket: {},
		},
		socket: {},
	}), undefined);

	t.end();
});
