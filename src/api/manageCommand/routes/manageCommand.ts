export default {
  routes: [
    {
     method: 'POST',
     path: '/send-command',
     handler: 'api::manage-command.manage-command.sendCommand',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
