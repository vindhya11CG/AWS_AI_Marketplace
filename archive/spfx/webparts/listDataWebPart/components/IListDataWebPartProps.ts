import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IListDataWebPartProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  siteUrl: string;
  context: WebPartContext;
  authenticated: boolean;
  passwordInput: string;
  authError: string;
}
