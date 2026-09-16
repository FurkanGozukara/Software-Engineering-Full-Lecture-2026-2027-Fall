"""Root conftest: registers the --site option early. Fixtures live in tests/conftest.py."""
import os


def pytest_addoption(parser):
    parser.addoption("--site", default=os.environ.get("SE_COURSE_SITE"),
                     help="path of the built course site (folder containing index.html and weeks/)")
