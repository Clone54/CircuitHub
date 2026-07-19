const jwt = require('jsonwebtoken');
const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFhMmIyYyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbXlwcm9qZWN0IiwidXNlcl9pZCI6InVzZXIxMjMifQ.signature';
console.log(jwt.decode(token));
