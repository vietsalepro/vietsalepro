## ADDED Requirements

### Requirement: Route `/import/create` renders the create form
The system SHALL expose a route `/import/create` that renders the ImportGoods create form.

#### Scenario: User navigates directly to create URL
- **GIVEN** the application is running
- **WHEN** the user navigates to `/import/create`
- **THEN** the create form of ImportGoods is rendered

### Requirement: URL drives the active tab
The system SHALL derive the ImportGoods active tab from the current URL path.

#### Scenario: `/import` shows history
- **GIVEN** the URL is `/import`
- **WHEN** ImportGoods renders
- **THEN** the active tab is set to `'history'`

#### Scenario: `/import/create` shows create
- **GIVEN** the URL is `/import/create`
- **WHEN** ImportGoods renders
- **THEN** the active tab is set to `'create'`

### Requirement: Menu highlights `/import` for sub-routes
The system SHALL highlight the Import menu item when the path starts with `/import`.

#### Scenario: Desktop sidebar on create URL
- **GIVEN** the user is on `/import/create`
- **WHEN** the desktop sidebar renders
- **THEN** the `/import` menu item is highlighted

#### Scenario: Mobile menu on create URL
- **GIVEN** the user is on `/import/create`
- **WHEN** the mobile menu renders
- **THEN** the Nhập hàng menu item is highlighted

## MODIFIED Requirements

### Requirement: Navigation actions update the URL
All in-component tab switching actions SHALL navigate to the corresponding URL instead of setting local state.

#### Scenario: User clicks "Nhập hàng" from history tab
- **GIVEN** the user is on the history tab at `/import`
- **WHEN** the user clicks the create button
- **THEN** the browser navigates to `/import/create`

#### Scenario: User cancels create form
- **GIVEN** the user is on `/import/create`
- **WHEN** the user clicks back or triggers `handleCancelEdit`
- **THEN** the browser navigates to `/import`

#### Scenario: Successful save returns to history
- **GIVEN** the user is on `/import/create`
- **WHEN** the receipt is saved or completed
- **THEN** the browser navigates to `/import`

## REMOVED Requirements

- None. The local `activeTab` state is replaced by URL-driven derivation; no feature is deprecated.
