import { createApp } from "./app.js";

const { httpServer } = await createApp();

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`LuxeLogic Server ready!`);
  console.log(`GraphQL: http://localhost:${PORT}/graphql`);
});
