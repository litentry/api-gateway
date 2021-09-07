import { PubSub } from 'graphql-subscriptions';
import { GraphQLScalarType, Kind } from 'graphql';
import { EventModel } from 'nft-models';

const pubsub = new PubSub();

const getEvents = async () => {
  return await EventModel.find({});
};

// type AddEventArgs = {
//   name: string;
// };

type EventDoc = {
  _id: string;
  name: string;
  data: [];
  createdAt: string;
  updatedAt: string;
};

type AddEventArgs = {
  doc: EventDoc; // instead of unknown
};

const eventScalar = new GraphQLScalarType({
  name: 'EventData',
  description: 'Event Data',
  serialize(value) {
    console.log(`SERIALIZE`);
    console.log(value);
    return value;
  },
  parseValue(value) {
    console.log(`parseValue`);
    console.log(value);
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast.fields;
    }
    return null; // Invalid hard-coded value (not an object)
  },
});

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.toISOString(); // Convert outgoing Date to ISOString for JSON
  },
  parseValue(value) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

const resolvers = {
  EventData: eventScalar,
  Date: dateScalar,
  Query: {
    events: () => getEvents(),
  },
  Mutation: {
    addEvent: async (_: any, args: AddEventArgs) => {
      //const event = await createEvent(args.name);
      console.log(`Event created 2.0`);
      console.log(args);
      pubsub.publish('EVENT_CREATED', { eventCreated: args });
    },
  },
  Subscription: {
    eventCreated: {
      subscribe: () => pubsub.asyncIterator(['EVENT_CREATED']),
    },
  },
};

export default resolvers;
