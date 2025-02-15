/**
 * A set of functions called "actions" for `manageCommand`
 */
import { Context } from "koa";
import { env } from "process";
import Stripe from 'stripe'; 

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
  },

  sessionPay: async (ctx: Context) => {

    const dataClient = ctx.request.body;
    if (!isDataValidCommandNumber(dataClient)) {
      console.log("Donné recu invalide");
      return ctx.badRequest("Data Invalide");
    }

    console.log("Donnée recu valide");
    console.log(dataClient.command);

    const command = await strapi.documents("api::commande.commande").findOne({
      documentId: dataClient.command,
      populate: {
        tickets: {
          populate: "*"
        }
      }
    });

    console.log(command);

    // Calcul du price 
    const totalPrice = command.tickets.reduce((acu, value) => acu + value.price.price, 0);

    // update the price of command
    await strapi.documents("api::commande.commande").update({
      documentId: command.documentId, 
      data: {
        total_price: totalPrice
      }
    })


    // création session Stripe
    const stripe = new Stripe(env.STRIPE_PRIVATE); 

    const session =  await stripe.checkout.sessions.create({
      ui_mode: 'embedded', 
      return_url: `${env.FRONT_URL}/return-stripe`, 
      mode: 'payment', 
      line_items: [
        {
          price_data: {
            unit_amount: totalPrice * 100, 
            currency: 'EUR', 
            product_data: {
              name: `Commande : ${command.documentId}`, 
              metadata: {
                documentId: command.documentId
              },
            }

          },
          quantity: 1
        }
      ], 
      metadata: {
        documentId: command.documentId
      }
      
    })

    ctx.body = {
      clientSecret: session.client_secret
    };
  }
};

type CommandNumber = {
  command: string;
}


function isDataValidCommandNumber(data: unknown): data is CommandNumber {
  if (data &&
    typeof data === "object" &&
    'command' in data &&
    typeof data.command === "string") return true;
  else return false;
}
