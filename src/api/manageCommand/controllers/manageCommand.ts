/**
 * A set of functions called "actions" for `manageCommand`
 */
import { Context } from "koa";

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
        // vérification des relations : 
        const listPrice = await strapi.documents("api::price.price").findMany();
        const listExposition = await strapi.documents("api::exposition.exposition").findMany();

        for (let choice of data) {
          if (!listExposition.some(expo => expo.id === choice.exposition))
             return ctx.badRequest("un ID exposition donnée n'existe pas");
          if (!listPrice.some(price => price.id === choice.price)) 
            return ctx.badRequest("Un ID Price donné n'existe pas");
        }

        newCommand = await strapi.documents("api::commande.commande").create({
          data: {
            user: ctx.state.user.id, 
            etat: "DRAFT",
          }
        });

        // pour chaque billet voulu, on genere un ticket
        for (let price of data) {
          for (let i = 0; i < price.quantity; i++) {

            await strapi.documents("api::ticket.ticket").create({
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
