module.exports = {
    apps: [
        {
            name: 'helmet-backend',
            cwd: './backend',
            script: './start.sh',
            interpreter: '/bin/bash',
            watch: false,
            env: {
                PYTHONUNBUFFERED: '1'
            }
        },
        {
            name: 'helmet-frontend',
            cwd: './frontend',
            script: 'npm',
            args: 'run dev -- --host',
            watch: false,
            env: {
                NODE_ENV: 'development'
            }
        }
    ]
};
