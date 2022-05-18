# Caveats

While I have been successfully using Pixaref for a while to manage an ever growing collection of reference images, there are a number of things you need to be aware of. I work in software development, and feel that I am at least somewhat qualified to distinguish between a production-ready application and an application for home use. Pixaref is definitely the latter.

## Security
The Pixaref server serves content over HTTP instead of HTTP/S, and it does not have any user management, authentication or authorization built in. It is intended to run on a closed network, and should not be exposed over the Internet. If you do plan to make Pixaref available over an insecure network, be sure to front it with a proxy like Nginx. Even so, while I endeavor to follow security best practices, this application did not undergo any security hardening or auditing, and any risks you incur are your own.

## Testing
Besides my daily personal use, this application did not undergo any testing. What's more, any form of unit testing and end-to-end testing is completely absent in the codebase. Your mileage may vary.

## Platform support
My home network consists entirely of Linux machines, and I only ever run the Pixaref server and client on various LTS versions of Ubuntu Linux. Could you get it to work on other Linux distributions? Most likely. Could you get it to run on Mac OS or Windows? Probably. Am I interested in catering to that? Unlikely.