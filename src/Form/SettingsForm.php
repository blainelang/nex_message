<?php

namespace Drupal\nex_message\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class SettingsForm extends ConfigFormBase {
  public function getFormId() { return 'nex_message_settings'; }
  protected function getEditableConfigNames() { return ['nex_message.settings']; }
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('nex_message.settings');
    $form['help'] = ['#markup' => '<p>' . $this->t('Timeouts are in seconds. Use 0 to keep messages visible until dismissed manually. Individual messages can override these defaults.') . '</p>'];
    if (\Drupal::moduleHandler()->moduleExists('help')) {
      $form['guide'] = [
        '#type' => 'link', '#title' => $this->t('Help and module integration examples'),
        '#url' => \Drupal\Core\Url::fromRoute('help.page', ['name' => 'nex_message']),
      ];
    }
    foreach (['status' => $this->t('Status messages'), 'warning' => $this->t('Warnings'), 'error' => $this->t('Errors')] as $type => $label) {
      $form[$type] = ['#type' => 'number', '#title' => $label, '#min' => 0, '#max' => 3600, '#step' => 1, '#required' => TRUE, '#default_value' => $config->get($type)];
    }
    return parent::buildForm($form, $form_state);
  }
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('nex_message.settings');
    foreach (['status', 'warning', 'error'] as $type) {
      $config->set($type, (int) $form_state->getValue($type));
    }
    $config->save();
    parent::submitForm($form, $form_state);
  }
}
