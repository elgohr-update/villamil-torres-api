import { Router } from "express";
import { userRoute } from "./user.route";
import { unitRoute } from "./unit.route";
import { maintenanceRoute } from "./maintenance.route";
import { waterRoute } from "./water.route";

interface IRoute {
  path: string;
  handler: Router;
  middleware: any[];
}

export const routes: IRoute[] = [
  {
    path: "/",
    handler: Router().get("/", (req, res) => res.json("Hi mundosss")),
    middleware: []
  },
  {
    path: "/users",
    handler: userRoute,
    middleware: []
  },
  {
    path: "/units",
    handler: unitRoute,
    middleware: []
  },
  {
    path: "/maintenance",
    handler: maintenanceRoute,
    middleware: []
  },
  {
    path: "/water",
    handler: waterRoute,
    middleware: []
  }
];
