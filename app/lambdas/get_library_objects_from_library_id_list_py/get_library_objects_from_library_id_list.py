#!/usr/bin/env python3

"""
Get library objects from library id list

Inputs:
    libraryIdList

Outputs:
    libraryObjectsList
"""

from orcabus_api_tools.metadata import get_libraries_list_from_library_id_list


def handler(event, context):
    """

    :param event:
    :param context:
    :return:
    """
    return {
        "libraryObjectsList": get_libraries_list_from_library_id_list(
            library_id_list=event.get("libraryIdList")
        )
    }
