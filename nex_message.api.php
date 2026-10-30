<?php

/**
 * Alters notification policy and declares dependencies of custom settings.
 *
 * @param array $policy
 *   Contains timeouts (status, warning, error) and overrides (message key =>
 *   nonnegative seconds). Zero means no automatic dismissal.
 * @param \Drupal\Core\Cache\CacheableMetadata $cacheability
 *   Add config dependencies and contexts for any dynamic policy values.
 */
function hook_nex_message_policy_alter(array &$policy, \Drupal\Core\Cache\CacheableMetadata $cacheability): void {
  $policy['overrides']['example.saved'] = 15;
  $policy['overrides']['example.action_required'] = 0;
}
