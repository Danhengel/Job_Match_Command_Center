from app.services import job_sources


def test_employer_catalog_includes_verified_lending_boards():
    catalog = job_sources.employer_catalog()
    greenhouse = {
        item["board"]: item["name"]
        for item in catalog.get("greenhouse", [])
    }

    expected = {
        "missionlane": "Mission Lane",
        "ocrolusinc": "Ocrolus",
        "lendingtree": "LendingTree",
        "enova": "Enova International",
        "upgrade": "Upgrade",
        "amount": "Amount",
        "hometap": "Hometap",
    }

    for board, company in expected.items():
        assert greenhouse.get(board) == company
