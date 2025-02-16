import middlewares from "../../../../config/middlewares";

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
    {
      method: 'POST', 
      path: '/session-pay', 
      handler: 'api::manage-command.manage-command.sessionPay', 
      config: {
        policies: [], 
        middlewares: [], 
      }
    }
  ],
};
