# har-time-player

### time sensitive har replay server

Time sensative as it runs the har in order based on calls hit, and removes them after they have been executed
ideal for linear test replay

# Install
    
    npm install -g har-time-player
    
# Usage 

    har-time-player -har=path/to/file.har -port=1337 -cors=http://myui.example.com -delay=300 -httpsRewrite=true
