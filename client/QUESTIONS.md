# Questions and Clarifications

- `POST /auth/register`: Appendix A specifies the successful response but not the request body. What request fields does the backend accept?
- `POST /auth/login`: Appendix A specifies the successful response and `INVALID_CREDENTIALS` but not the request body. What request fields does the backend accept?
- `POST /admin/products` and `PATCH /admin/products/{id}`: Appendix A does not define either request body. What are their exact request fields?
- `GET /cart`: Appendix A says it returns cart contents and a total but does not define the response item shape. What are the exact response fields?
- `GET /library`: Appendix A does not define the response item shape. What are the exact response fields?
- `GET /orders`: Does each order in the paginated response include `items`?
- `GET /admin/orders`: Does each order include `items`, and is the response paginated?
- `GET /admin/products`: What is the response envelope and pagination behavior?
- `POST /cart/items`: What response body, if any, is returned with `201`?
- `POST /orders`: What response body is returned with `201`?
- `POST /admin/products` and `PATCH /admin/products/{id}`: What response bodies, if any, are returned on success?
- Appendix A mentions `errors` in the error shape but does not define its structure. `ApiError` currently has no `errors` field.
