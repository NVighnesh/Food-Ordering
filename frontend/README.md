# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Project Customizations

### Inactivity Auto-Logout
The application automatically logs a user out after 3 minutes of no activity (no mouse / keyboard / visibility). The timer resets on user activity. Adjust the timeout or events in `src/index.js` where the handlers are registered.

### Option A: Stripe Multi-Line Item Support
When creating an order, the frontend now derives a `stripeLineItems` array from the sanitized order items and includes it in the POST `/api/order` payload. Each element:
```
{
	name: string,
	quantity: number,
	unit_amount: integer (smallest currency unit),
	productId: string|number
}
```
Backend can use this directly to create a Stripe Checkout Session. (Assumes prices are in INR; adjust multiplier in `createOrder` if using a different currency or a price already in smallest denomination.)

### Option B: Order DTO Normalization
Orders returned from `/api/order/user` are normalized to a consistent shape via `orderNormalizer.js`:
```
{
	id, status, totalPrice, createdAt, items: [ { id, productId, name, quantity, unitPrice, totalPrice, imageUrl } ]
}
```
This allows UI components (`Orders.jsx`, `OrderCard.jsx`) to assume stable fields and removes scattered fallback logic. Legacy fields are still preserved on the order object for backward compatibility.

### Local Order Item Snapshots (Fallback)
During order creation a sanitized item snapshot is stored (`order_items_<orderId>`). If the backend responds without line items (lazy load or serialization gap) the fetch logic hydrates them locally. This can be removed once the backend always returns items in its DTO.

### Where to Adjust
- Stripe mapping: `src/component/State/Order/Action.js` inside `createOrder` (search for `stripeLineItems`).
- Normalization: `src/component/State/Order/orderNormalizer.js`.
- Orders UI: `src/component/Profile/Orders.jsx` & `OrderCard.jsx` rely on normalized fields.

### Future Clean-Up Ideas
- Remove snapshot hydration once backend DTO is guaranteed.
- Add pagination or infinite scroll for large order histories.
- Expose currency configuration via environment variable for Stripe line item unit conversion.

### Favorites Persistence & Isolation
Favorites are now stored per-user instead of a single global `favorites` array that could leak between sessions:

How it works:
- After successful profile fetch (`getUser`), the user id is extracted and a scoped key `favorites_<userId>` is used.
- Server favorites (if any) are treated as authoritative and merged with any locally cached scoped + legacy favorites without duplicates (union by id / restaurantId / _id).
- The merged list is written back to `favorites_<userId>` and also mirrored to the legacy `favorites` key for backward compatibility with any older components still reading it.
- On logout the legacy global `favorites` key and any auth/profile keys are removed so another user starting a fresh session does not see previous favorites.

Migration Behavior:
- If a legacy `favorites` key exists but no scoped key yet, its contents are merged into the new scoped storage at next login.
- Legacy key is then removed (except for the compatibility mirror written after merge) preventing cross-user leakage.

Adding / Removing Favorites:
- Toggling a favorite calls the backend endpoint then updates Redux and rewrites both the scoped key and compatibility key.

Developer Notes:
- Scoped key pattern: `favorites_<userId>` where userId comes from `data.id || data._id || data.userId`.
- To inspect in DevTools: `localStorage.getItem('favorites_<userId>')`.
- To fully reset local favorites for a user (while signed in) you can manually clear the scoped key, then dispatch `getUser(jwt)` to repopulate from server.

