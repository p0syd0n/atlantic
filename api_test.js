import request from 'request';
var options = {
  'method': 'POST',
  'url': 'https://pacific-posydon.harperdbcloud.com',
  'headers': {
    'Content-Type': 'application/json',
    'Authorization': 'Basic cG9zeWRvbjpBcnRodXJSdXNhaWtpbjIwMDgh'
  },
  body: JSON.stringify({
    "operation": "sql",
    "sql": "SELECT * FROM atlantic.users"
})

};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});