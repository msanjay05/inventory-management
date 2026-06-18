import phonenumbers
from phonenumbers import NumberParseException


class PhoneValidationError(ValueError):
    pass


def normalize_phone(country_code: str, phone_number: str) -> str:
    country_code = country_code.strip()
    phone_number = phone_number.strip().replace("-", "").replace(" ", "")

    if not country_code.startswith("+"):
        country_code = f"+{country_code.lstrip('+')}"

    national = phone_number.lstrip("0") if phone_number.startswith("0") else phone_number
    full_number = f"{country_code}{national}"

    try:
        parsed = phonenumbers.parse(full_number, None)
    except NumberParseException:
        raise PhoneValidationError("Invalid phone number") from None

    if not phonenumbers.is_valid_number(parsed):
        raise PhoneValidationError("Invalid phone number")

    expected_code = country_code.lstrip("+")
    if str(parsed.country_code) != expected_code:
        raise PhoneValidationError("Phone number does not match country code")

    formatted_code = f"+{parsed.country_code}"
    formatted_number = str(parsed.national_number)
    return f"{formatted_code}-{formatted_number}"
