/**
 * A set of functions called "actions" for `manageCommand`
 */
import { Context } from "koa";

const { validate } = strapi.contentAPI;

type QuantityPerPrice = {
  price: number;
  quantity: number;
  exposition: number;
}

function isValidData(data: unknown): data is QuantityPerPrice[] {
  if (Array.isArray(data) &&
    data.every(item => {
      if (
        typeof item === "object" &&

        // vérification attributes price 
        'price' in item &&
        typeof item.price === "number" &&

        // vérification attributes quantity
        "quantity" in item &&
        typeof item.quantity === "number" &&
        item.quantity > 0 &&

        // vérification attributes exposition
        "exposition" in item && 
        typeof item.exposition === "number" 

      ) return true;
      else return false
    })

  ) return true;
  else return false;
}


export default {
  sendCommand: async (ctx: Context) => {
    try {

      let data = ctx.request.body;
      let newCommand;

      // vérification du type et traitement 
      if (isValidData(data)) {
        // Data valide, on travaille

        newCommand = await strapi.documents("api::commande.commande").create({
          data: {
            user: ctx.state.user.id, // hardcoder pour lest test
            etat: "DRAFT",
          }
        });

        console.log("la commande : " , newCommand); 


        // pour chaque billet voulu, on genere un ticket
        for (let price of data) {
          for (let i = 0; i < price.quantity; i++) {

            console.log("Génération d'un billet");
            strapi.documents("api::ticket.ticket").create({
              data: {
                price: price.price,
                exposition: price.exposition,
                commande: newCommand.id
              }
            })
          }
        }

        ctx.body = newCommand;
      } else {
        // Data Invalide on envoi un message d'erreur en retour 
        return ctx.badRequest("Format de la request invalide")
      }

    } catch (err) {
      ctx.body = err;
    }
  }
};
