import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/scripted';

const checkType = CheckType.Browser;

describe(`BrowserCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(FIVE_MINUTES_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const ONE_MINUTE_IN_MS = 1 * 60 * 1000;

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 5);

    const minutesInput = screen.getByLabelText('frequency minutes input');
    const secondsInput = screen.getByLabelText('frequency seconds input');
    await user.clear(minutesInput);
    await user.clear(secondsInput);
    await user.type(minutesInput, `{backspace}1`);

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(ONE_MINUTE_IN_MS);
  });
});
