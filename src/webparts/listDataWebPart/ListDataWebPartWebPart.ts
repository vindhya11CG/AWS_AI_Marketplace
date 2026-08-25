
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import ListDataWebPart from './components/ListDataWebPart';
import { IListDataWebPartProps } from './components/IListDataWebPartProps';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let _sp: any;
 
export default class ListDataWebPartWebPart extends BaseClientSideWebPart<IListDataWebPartProps> {
  public onInit(): Promise<void> {
    return super.onInit().then(async _ => {
      const { spfi } = await import(/* webpackChunkName: "pnp-sp" */ "@pnp/sp");
      const { SPFx } = await import(/* webpackChunkName: "pnp-sp-presets" */ "@pnp/sp/presets/all");
      _sp = spfi().using(SPFx(this.context));
    });
  }


  public render(): void {
    const element: React.ReactElement<IListDataWebPartProps> = React.createElement(
      ListDataWebPart,
      {
        description: this.properties.description,
        isDarkTheme: false,
        environmentMessage: "",
        hasTeamsContext: false,
        userDisplayName: "",
        siteUrl: "https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace",
        context: this.context, // ✅ Pass context for PnPjs
        authenticated: false, 
        passwordInput: "",     
        authError: ""


      }
    );

    ReactDom.render(element, this.domElement);
  }

  // Ensure we unmount the React component when the web part is disposed to avoid memory leaks
  public onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
    super.onDispose();
  }
}














// import * as React from 'react';
// import * as ReactDom from 'react-dom';
// import ListDataWebPart from './components/ListDataWebPart';
// import { IListDataWebPartProps } from './components/IListDataWebPartProps';
// import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

// export default class ListDataWebPartWebPart extends BaseClientSideWebPart<IListDataWebPartProps> {
//   public render(): void {
//     const element: React.ReactElement = React.createElement(ListDataWebPart, {
//       siteUrl: this.context.pageContext.web.absoluteUrl
//     });

//     ReactDom.render(element, this.domElement);
//   }
// }
 