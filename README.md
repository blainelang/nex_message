# Nex Message

Settings: `/admin/config/user-interface/nex-message` (administer site configuration).
Timeouts are seconds; 0 means no automatic dismissal. Defaults: status 10, warning 0, error 0. Persistent messages retain their theme's existing manual close behavior.

Only Drupal notification containers and explicitly tagged `.messages` panels are managed. Countdown pauses on hover, focus and hidden tabs. Close now appears beside the countdown and dismisses the message immediately. Keep open stops the countdown permanently for that displayed message; Close now remains available. AJAX attachments are supported; reduced motion disables the fade.

## Per-message overrides

Add `data-nex-timeout="20"` to a message container or an element inside a Messenger message. Set `data-nex-timeout="0"` to keep it visible. For a render array:

```php
'#attributes' => [
  'data-nex-message' => 'editorial.pending_draft',
  'data-nex-timeout' => '0',
],
```

For named policy defaults implement `hook_nex_message_policy_alter()`. This example shows an optional integration in Nex Editorial; it is not installed automatically:

```php
function nex_editorial_nex_message_policy_alter(array &$policy, \Drupal\Core\Cache\CacheableMetadata $cacheability): void {
  $policy['overrides']['editorial.saved'] = 15;
  $policy['overrides']['editorial.pending_draft'] = 0;
}
```

Explicit timeout attributes take precedence over named policy values. Any persistent override retains the entire grouped container; otherwise the longest explicit override wins. Ordinary, untagged messages use the message-type default. Do not identify messages by translated text. Policy hooks should be site-wide; request-specific changes require corresponding attachment cache contexts.

For Messenger messages, render a safe render array containing the metadata wrapper before passing it to Messenger; do not concatenate unescaped user content into markup. Merely using a named policy does not tag a message automatically.

The module does not change validation, moderation, permissions or Content Lock behavior. The editorial pending-draft panel explicitly opts out of auto-dismissal.

## Administration and full guide

Configure and Help links appear on Extend. The settings form also links to `/admin/help/nex_message`. The full guide is maintained in `help.html`, including complete Messenger examples and configuration-backed policies. The hook contract is documented in `nex_message.api.php`.

Policy hooks receive an optional second argument, `CacheableMetadata $cacheability`. When reading another module’s configuration, call `$cacheability->addCacheableDependency($config)`. Add cache contexts for request-dependent policies.

## Reuse

Nex Message is independent of Nex Editorial. Configure site-wide timeouts per site. Optional sender modules tag messages and may implement `hook_nex_message_policy_alter()`. This module creates no roles or role permissions.

Policy keys such as `editorial.saved` are developer-defined labels, independent of module names. The configuration example in Help uses hypothetical `my_module.settings`; its schema and settings form must be supplied by that module.
